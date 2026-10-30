"""
UPI Transaction Fraud Detection Service.

Performs rule-based, anomaly detection (IsolationForest), and graph-based
analysis on a list of UPI transactions.

LIMITATIONS (communicated to clients):
- Anomaly detection model is trained on submitted data only; no historical baseline.
- Rules are heuristic; legitimate high-frequency merchants may trigger false positives.
- Graph analysis identifies structural patterns, not confirmed fraud.
- No real-time lookup against NPCI/bank databases is performed.
"""

from __future__ import annotations

import hashlib
import logging
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any

import networkx as nx
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

logger = logging.getLogger(__name__)

RULE_VERSION = "1.0.0"
MODEL_VERSION = "isolation_forest_v1"

LIMITATIONS = [
    "Analysis is based solely on the submitted transactions; no external database lookup is performed.",
    "Anomaly detection uses an unsupervised model trained on submitted data only.",
    "Rule thresholds are heuristic and may produce false positives for high-frequency merchants.",
    "Graph patterns indicate structural anomalies, not confirmed fraud.",
    "Results are for informational purposes only and do not constitute legal evidence.",
]


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _defanged_upi(upi_id: str | None) -> str:
    """Return a safe display version of a UPI ID."""
    if not upi_id:
        return "unknown"
    parts = upi_id.split("@")
    if len(parts) == 2:
        user = parts[0]
        masked = user[:2] + "***" + user[-1:] if len(user) > 3 else "***"
        return f"{masked}@{parts[1]}"
    return upi_id[:4] + "***"


def _hash_upi(upi_id: str | None) -> str:
    if not upi_id:
        return "unknown"
    return hashlib.sha256(upi_id.lower().strip().encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Rules Engine
# ---------------------------------------------------------------------------

def check_velocity(transactions: list[dict]) -> list[dict]:
    """Flag if more than 5 transactions occur within any 1-hour window."""
    indicators: list[dict] = []
    timed = [t for t in transactions if t.get("timestamp")]
    if len(timed) < 6:
        return indicators

    timed.sort(key=lambda t: t["timestamp"])
    window = timedelta(hours=1)

    for i, anchor in enumerate(timed):
        count = sum(
            1 for t in timed[i:]
            if t["timestamp"] - anchor["timestamp"] <= window
        )
        if count > 5:
            indicators.append({
                "code": "HIGH_VELOCITY",
                "type": "behavioral",
                "explanation": f"{count} transactions detected within a 1-hour window starting at "
                               f"{anchor['timestamp'].isoformat()}. High transaction velocity is a "
                               "common indicator of account takeover or automated fraud.",
                "evidence_reference": f"transactions around {anchor['timestamp'].isoformat()}",
                "severity": "high",
                "method": "rule_based",
                "confidence": None,
            })
            break  # Report once
    return indicators


def check_many_to_one(transactions: list[dict]) -> list[dict]:
    """Flag if more than 3 unique senders send to the same recipient."""
    indicators: list[dict] = []
    recipient_senders: dict[str, set] = defaultdict(set)

    for t in transactions:
        if t.get("recipient_upi") and t.get("sender_upi"):
            recipient_senders[t["recipient_upi"]].add(t["sender_upi"])

    for recipient, senders in recipient_senders.items():
        if len(senders) > 3:
            indicators.append({
                "code": "MANY_TO_ONE_AGGREGATION",
                "type": "structural",
                "explanation": f"{len(senders)} unique senders are sending funds to a single "
                               f"recipient ({_defanged_upi(recipient)}). This is a known money-mule "
                               "aggregation pattern.",
                "evidence_reference": f"recipient: {_defanged_upi(recipient)}",
                "severity": "high",
                "method": "rule_based",
                "confidence": None,
            })
    return indicators


def check_one_to_many(transactions: list[dict]) -> list[dict]:
    """Flag if one sender sends to more than 5 distinct recipients within 24 hours."""
    indicators: list[dict] = []
    timed = [t for t in transactions if t.get("timestamp") and t.get("sender_upi")]

    sender_time_recipients: dict[str, list[tuple]] = defaultdict(list)
    for t in timed:
        sender_time_recipients[t["sender_upi"]].append((t["timestamp"], t.get("recipient_upi")))

    window = timedelta(hours=24)
    for sender, entries in sender_time_recipients.items():
        entries.sort(key=lambda x: x[0])
        for i, (start_time, _) in enumerate(entries):
            recipients_in_window = {
                r for ts, r in entries[i:]
                if ts - start_time <= window and r
            }
            if len(recipients_in_window) > 5:
                indicators.append({
                    "code": "ONE_TO_MANY_DISTRIBUTION",
                    "type": "structural",
                    "explanation": f"Sender {_defanged_upi(sender)} sent to {len(recipients_in_window)} "
                                   "distinct recipients within 24 hours. This fan-out pattern is "
                                   "associated with smurfing and fraud disbursement schemes.",
                    "evidence_reference": f"sender: {_defanged_upi(sender)}",
                    "severity": "medium",
                    "method": "rule_based",
                    "confidence": None,
                })
                break
    return indicators


def check_round_amount(transactions: list[dict]) -> list[dict]:
    """Flag suspiciously round amounts (exact multiples of 1000)."""
    indicators: list[dict] = []
    round_txns = [
        t for t in transactions
        if t.get("amount") and t["amount"] > 0 and t["amount"] % 1000 == 0
    ]
    ratio = len(round_txns) / len(transactions) if transactions else 0
    if ratio > 0.7 and len(round_txns) >= 3:
        amounts = [t["amount"] for t in round_txns]
        indicators.append({
            "code": "ROUND_AMOUNT_PATTERN",
            "type": "behavioral",
            "explanation": f"{len(round_txns)} of {len(transactions)} transactions are exact "
                           f"multiples of ₹1,000 ({ratio*100:.0f}%). Round-amount structuring is "
                           "used to avoid automated fraud detection thresholds.",
            "evidence_reference": f"amounts: {sorted(set(amounts))[:10]}",
            "severity": "medium",
            "method": "rule_based",
            "confidence": None,
        })
    return indicators


def check_rapid_succession(transactions: list[dict]) -> list[dict]:
    """Flag transactions occurring less than 5 minutes apart."""
    indicators: list[dict] = []
    timed = [t for t in transactions if t.get("timestamp")]
    if len(timed) < 2:
        return indicators

    timed.sort(key=lambda t: t["timestamp"])
    rapid_pairs: list[str] = []
    threshold = timedelta(minutes=5)

    for i in range(len(timed) - 1):
        delta = timed[i + 1]["timestamp"] - timed[i]["timestamp"]
        if timedelta(0) <= delta < threshold:
            rapid_pairs.append(
                f"{timed[i].get('transaction_ref', 'N/A')} → "
                f"{timed[i+1].get('transaction_ref', 'N/A')} "
                f"({int(delta.total_seconds())}s apart)"
            )

    if len(rapid_pairs) >= 2:
        indicators.append({
            "code": "RAPID_SUCCESSION",
            "type": "behavioral",
            "explanation": f"{len(rapid_pairs)} transaction pairs occurred within 5 minutes of "
                           "each other. Rapid succession is associated with automated bots or "
                           "account compromised by an attacker acting quickly.",
            "evidence_reference": "; ".join(rapid_pairs[:5]),
            "severity": "medium",
            "method": "rule_based",
            "confidence": None,
        })
    return indicators


def check_off_hours(transactions: list[dict]) -> list[dict]:
    """Flag transactions occurring between 1 AM and 5 AM IST."""
    indicators: list[dict] = []
    IST = timezone(timedelta(hours=5, minutes=30))
    off_hour_txns = []

    for t in transactions:
        if t.get("timestamp"):
            ts_ist = t["timestamp"].astimezone(IST)
            if 1 <= ts_ist.hour < 5:
                off_hour_txns.append(t)

    if off_hour_txns:
        indicators.append({
            "code": "OFF_HOURS_ACTIVITY",
            "type": "temporal",
            "explanation": f"{len(off_hour_txns)} transaction(s) occurred between 1:00 AM and "
                           "5:00 AM IST. Late-night activity is often associated with unauthorised "
                           "access while the account holder is asleep.",
            "evidence_reference": ", ".join(
                t.get("transaction_ref", "N/A") for t in off_hour_txns[:5]
            ),
            "severity": "medium",
            "method": "rule_based",
            "confidence": None,
        })
    return indicators


def check_new_recipient(
    transactions: list[dict], known_recipients: set[str] | None = None
) -> list[dict]:
    """Flag first-time recipients not seen in the submitted dataset history."""
    indicators: list[dict] = []
    if known_recipients is None:
        known_recipients = set()

    unknown = [
        t for t in transactions
        if t.get("recipient_upi") and t["recipient_upi"] not in known_recipients
    ]
    if unknown:
        indicators.append({
            "code": "NEW_RECIPIENT",
            "type": "behavioral",
            "explanation": f"{len(unknown)} transaction(s) sent to recipient UPI IDs not seen in "
                           "prior transaction history. Sending to new/unknown payees carries "
                           "elevated risk, especially combined with other indicators.",
            "evidence_reference": ", ".join(
                _defanged_upi(t.get("recipient_upi")) for t in unknown[:5]
            ),
            "severity": "low",
            "method": "rule_based",
            "confidence": None,
        })
    return indicators


# ---------------------------------------------------------------------------
# Feature Extraction & Anomaly Detection
# ---------------------------------------------------------------------------

def extract_features(transactions: list[dict]) -> pd.DataFrame:
    """
    Build a feature DataFrame from transactions for anomaly detection.
    All features are numeric.
    """
    rows = []
    timed = [t for t in transactions if t.get("timestamp")]
    timed.sort(key=lambda t: t["timestamp"])

    # Pre-compute velocity counts
    window = timedelta(hours=1)
    for i, t in enumerate(timed):
        hour = t["timestamp"].hour
        minute = t["timestamp"].minute
        dow = t["timestamp"].weekday()
        amount = float(t.get("amount", 0))
        is_round = 1 if amount > 0 and amount % 1000 == 0 else 0

        # Count transactions in preceding 1-hour window
        vel = sum(
            1 for other in timed
            if timedelta(0) <= t["timestamp"] - other["timestamp"] <= window
        )

        rows.append({
            "amount": amount,
            "hour": hour,
            "minute": minute,
            "day_of_week": dow,
            "is_round_amount": is_round,
            "velocity_1h": vel,
        })

    if not rows:
        # Fall back to non-timestamped transactions with partial features
        for t in transactions:
            amount = float(t.get("amount", 0))
            rows.append({
                "amount": amount,
                "hour": 12,
                "minute": 0,
                "day_of_week": 0,
                "is_round_amount": 1 if amount > 0 and amount % 1000 == 0 else 0,
                "velocity_1h": 1,
            })

    return pd.DataFrame(rows)


def run_anomaly_detection(transactions: list[dict]) -> list[dict]:
    """
    Fit an IsolationForest on submitted transactions and return indicators
    for anomalous ones.

    NOTE: The model is trained on submitted data only — no historical baseline.
    """
    indicators: list[dict] = []
    if len(transactions) < 5:
        return indicators

    df = extract_features(transactions)
    if df.empty:
        return indicators

    try:
        clf = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
        )
        clf.fit(df)
        scores = clf.score_samples(df)
        predictions = clf.predict(df)

        anomalous_indices = [i for i, p in enumerate(predictions) if p == -1]
        if anomalous_indices:
            src = [t for t in transactions if t.get("timestamp")]
            src = src if src else transactions

            refs = []
            for idx in anomalous_indices[:5]:
                if idx < len(src):
                    refs.append(src[idx].get("transaction_ref", f"index-{idx}"))

            indicators.append({
                "code": "ML_ANOMALY_DETECTED",
                "type": "statistical",
                "explanation": f"IsolationForest flagged {len(anomalous_indices)} transaction(s) as "
                               "statistical outliers based on amount, timing, and velocity features. "
                               "These deviate significantly from the overall pattern in the submission.",
                "evidence_reference": ", ".join(refs),
                "severity": "medium",
                "method": "isolation_forest",
                "confidence": float(np.mean(np.abs(scores[anomalous_indices]))),
            })
    except Exception as exc:
        logger.warning("Anomaly detection failed: %s", exc)

    return indicators


# ---------------------------------------------------------------------------
# Graph Analysis
# ---------------------------------------------------------------------------

def build_transaction_graph(transactions: list[dict]) -> nx.DiGraph:
    """Build a directed graph: nodes are UPI IDs, edges are transactions."""
    G = nx.DiGraph()
    for t in transactions:
        sender = t.get("sender_upi") or "unknown_sender"
        recipient = t.get("recipient_upi") or "unknown_recipient"
        G.add_node(sender)
        G.add_node(recipient)
        G.add_edge(
            sender,
            recipient,
            amount=t.get("amount", 0),
            timestamp=t.get("timestamp", ""),
            ref=t.get("transaction_ref", ""),
        )
    return G


def detect_graph_patterns(G: nx.DiGraph, transactions: list[dict]) -> list[dict]:
    """
    Identify suspicious structural patterns in the transaction graph:
    - Hub nodes (high in-degree or out-degree)
    - Chain structures (long paths)
    """
    indicators: list[dict] = []
    if len(G.nodes) == 0:
        return indicators

    # Hub detection — in-degree > 4
    high_in = [(n, d) for n, d in G.in_degree() if d > 4]
    if high_in:
        hub = max(high_in, key=lambda x: x[1])
        indicators.append({
            "code": "GRAPH_HUB_NODE",
            "type": "structural",
            "explanation": f"UPI ID {_defanged_upi(hub[0])} is receiving funds from {hub[1]} "
                           "distinct senders, forming a hub pattern. Hubs are characteristic of "
                           "money-mule and fund-aggregation networks.",
            "evidence_reference": f"{_defanged_upi(hub[0])} (in-degree={hub[1]})",
            "severity": "high",
            "method": "graph_analysis",
            "confidence": None,
        })

    # Hub detection — out-degree > 5
    high_out = [(n, d) for n, d in G.out_degree() if d > 5]
    if high_out:
        hub = max(high_out, key=lambda x: x[1])
        indicators.append({
            "code": "GRAPH_DISTRIBUTION_HUB",
            "type": "structural",
            "explanation": f"UPI ID {_defanged_upi(hub[0])} is distributing funds to {hub[1]} "
                           "distinct recipients, a fan-out pattern consistent with fraud "
                           "disbursement or layering.",
            "evidence_reference": f"{_defanged_upi(hub[0])} (out-degree={hub[1]})",
            "severity": "high",
            "method": "graph_analysis",
            "confidence": None,
        })

    # Chain detection — look for paths longer than 3 hops
    try:
        undirected = G.to_undirected()
        if len(undirected.nodes) > 2:
            longest_path_len = max(
                (len(path) for u in undirected.nodes
                 for v in undirected.nodes
                 if u != v
                 for path in [nx.shortest_path(undirected, u, v)]
                 if len(path) > 3),
                default=0,
            )
            if longest_path_len > 3:
                indicators.append({
                    "code": "GRAPH_CHAIN_STRUCTURE",
                    "type": "structural",
                    "explanation": f"A transaction chain of length {longest_path_len} nodes was "
                                   "detected. Long chains are used for layering — splitting and "
                                   "redirecting funds across multiple accounts to obscure origin.",
                    "evidence_reference": f"chain length: {longest_path_len}",
                    "severity": "medium",
                    "method": "graph_analysis",
                    "confidence": None,
                })
    except Exception:
        pass  # Graph too small or disconnected; skip chain analysis

    return indicators


def get_graph_data(transactions: list[dict]) -> dict[str, Any]:
    """
    Return serializable graph data for frontend visualisation.
    UPI IDs are defanged before returning.
    """
    G = build_transaction_graph(transactions)

    node_roles: dict[str, set] = defaultdict(set)
    for t in transactions:
        if t.get("sender_upi"):
            node_roles[t["sender_upi"]].add("sender")
        if t.get("recipient_upi"):
            node_roles[t["recipient_upi"]].add("recipient")

    nodes = []
    for node in G.nodes:
        roles = node_roles.get(node, {"unknown"})
        node_type = "both" if len(roles) > 1 else next(iter(roles))
        nodes.append({
            "id": _hash_upi(node),
            "label": _defanged_upi(node),
            "type": node_type,
            "transaction_count": G.degree(node),
        })

    edges = []
    for src, tgt, data in G.edges(data=True):
        ts = data.get("timestamp", "")
        edges.append({
            "source": _hash_upi(src),
            "target": _hash_upi(tgt),
            "amount": data.get("amount", 0),
            "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
            "reference": data.get("ref", ""),
        })

    return {"nodes": nodes, "edges": edges}


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def analyze_transactions(
    transactions_data: list[dict], analysis_run_id: str
) -> dict[str, Any]:
    """
    Run the complete UPI fraud analysis pipeline:
    1. Rules engine
    2. Anomaly detection (IsolationForest)
    3. Graph analysis

    Returns a dict with 'indicators', 'graph_data', and 'limitations'.
    """
    # Normalise timestamps to UTC datetime objects
    for t in transactions_data:
        ts = t.get("timestamp")
        if isinstance(ts, str):
            try:
                t["timestamp"] = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                t["timestamp"] = None
        elif isinstance(ts, datetime) and ts.tzinfo is None:
            t["timestamp"] = ts.replace(tzinfo=timezone.utc)

    indicators: list[dict] = []

    # Run all rules
    known_recipients: set[str] = set()
    indicators += check_velocity(transactions_data)
    indicators += check_many_to_one(transactions_data)
    indicators += check_one_to_many(transactions_data)
    indicators += check_round_amount(transactions_data)
    indicators += check_rapid_succession(transactions_data)
    indicators += check_off_hours(transactions_data)
    indicators += check_new_recipient(transactions_data, known_recipients)

    # Anomaly detection
    indicators += run_anomaly_detection(transactions_data)

    # Graph analysis
    G = build_transaction_graph(transactions_data)
    indicators += detect_graph_patterns(G, transactions_data)

    # Graph data for visualisation
    graph_data = get_graph_data(transactions_data)

    return {
        "analysis_run_id": analysis_run_id,
        "indicators": indicators,
        "graph_data": graph_data,
        "rule_version": RULE_VERSION,
        "model_version": MODEL_VERSION,
        "limitations": LIMITATIONS,
    }
