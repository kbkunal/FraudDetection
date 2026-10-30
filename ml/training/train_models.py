"""
CyberShield ML Model Training Script
Trains and saves baseline classifiers for message and email fraud detection.

Dataset: Synthetic examples (see ml/datasets/)
Model: TF-IDF + Logistic Regression (baseline)

IMPORTANT: These models are trained on synthetic data only.
Performance on synthetic data does NOT represent real-world accuracy.
All outputs must be treated as review-priority indicators, NOT proof of fraud.
"""

import os
import sys
import json
import pickle
import logging
from datetime import datetime
from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    classification_report, confusion_matrix,
    precision_recall_fscore_support, accuracy_score
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.multiclass import OneVsRestClassifier

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
MODEL_REGISTRY = BASE_DIR / "model_registry"
MODEL_REGISTRY.mkdir(exist_ok=True)


def load_message_dataset():
    """Load and prepare the synthetic message dataset."""
    csv_path = DATASETS_DIR / "synthetic_messages.csv"
    if not csv_path.exists():
        logger.error(f"Dataset not found: {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} message examples")
    logger.info(f"Label distribution:\n{df['label'].value_counts()}")
    return df


def load_email_dataset():
    """Load and prepare the synthetic email dataset."""
    csv_path = DATASETS_DIR / "synthetic_emails.csv"
    if not csv_path.exists():
        logger.error(f"Dataset not found: {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    logger.info(f"Loaded {len(df)} email examples")
    logger.info(f"Label distribution:\n{df['category'].value_counts()}")
    return df


def train_message_classifier(df):
    """
    Train a TF-IDF + Logistic Regression message classifier.

    NOTE: Trained on synthetic data only. Real-world performance will differ.
    These scores should NOT be used as deployment accuracy claims.
    """
    logger.info("Training message fraud classifier...")

    X = df['text'].fillna('')
    y = df['label']

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Train/test split - stratified to maintain class balance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    # Pipeline: TF-IDF + Logistic Regression
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            sublinear_tf=True,
            min_df=1
        )),
        ('clf', LogisticRegression(
            C=1.0,
            max_iter=1000,
            random_state=42,
            class_weight='balanced'
        ))
    ])

    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    logger.info(f"Message Classifier — Test Accuracy: {accuracy:.3f}")

    # Per-class metrics
    report = classification_report(
        y_test, y_pred,
        target_names=le.classes_,
        output_dict=True
    )
    logger.info(f"Classification Report:\n{classification_report(y_test, y_pred, target_names=le.classes_)}")

    # Cross-validation
    cv_scores = cross_val_score(pipeline, X, y_encoded, cv=3, scoring='f1_macro')
    logger.info(f"Cross-Validation F1 (macro): {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    # Save model metadata
    metadata = {
        "model_name": "message_fraud_classifier",
        "model_type": "TF-IDF + Logistic Regression",
        "version": "1.0.0",
        "training_date": datetime.now().isoformat(),
        "dataset": "synthetic_messages.csv",
        "dataset_source": "Synthetic — NOT real SMS/WhatsApp data",
        "n_training_examples": len(X_train),
        "n_test_examples": len(X_test),
        "classes": le.classes_.tolist(),
        "test_accuracy": float(accuracy),
        "cv_f1_macro_mean": float(cv_scores.mean()),
        "cv_f1_macro_std": float(cv_scores.std()),
        "classification_report": report,
        "limitations": [
            "Trained on synthetic data only — real-world performance will differ significantly",
            "This dataset is not representative of real Indian SMS fraud patterns",
            "Model predictions are review-priority indicators, NOT proof of fraud",
            "Do not use these scores as calibrated fraud probabilities",
            "Human review is required for all flagged items",
            "Performance on Hindi/Marathi messages is limited by dataset size"
        ],
        "threshold_note": "Default threshold is 0.5. Adjust based on acceptable false positive rate.",
        "human_review_required": True
    }

    return pipeline, le, metadata


def train_email_classifier(df):
    """
    Train a TF-IDF + Logistic Regression email classifier.

    NOTE: Trained on synthetic data only.
    """
    logger.info("Training email fraud classifier...")

    # Combine subject + body_preview for features
    X = (df['subject'].fillna('') + ' ' + df['body_preview'].fillna(''))
    y = df['category']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            sublinear_tf=True,
            min_df=1
        )),
        ('clf', LogisticRegression(
            C=1.0,
            max_iter=1000,
            random_state=42,
            class_weight='balanced'
        ))
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    logger.info(f"Email Classifier — Test Accuracy: {accuracy:.3f}")

    report = classification_report(
        y_test, y_pred,
        target_names=le.classes_,
        output_dict=True,
        zero_division=0
    )
    logger.info(f"Classification Report:\n{classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0)}")

    metadata = {
        "model_name": "email_fraud_classifier",
        "model_type": "TF-IDF + Logistic Regression",
        "version": "1.0.0",
        "training_date": datetime.now().isoformat(),
        "dataset": "synthetic_emails.csv",
        "dataset_source": "Synthetic — NOT real email corpus",
        "n_training_examples": len(X_train),
        "n_test_examples": len(X_test),
        "classes": le.classes_.tolist(),
        "test_accuracy": float(accuracy),
        "classification_report": report,
        "limitations": [
            "Trained on a very small synthetic dataset",
            "BEC detection is inherently difficult — these examples are stylized",
            "SPF/DKIM/DMARC analysis is rule-based, not ML-based",
            "Predictions are review-priority indicators only",
            "Authentication-pass emails can still be phishing (attacker-owned domains)",
            "Human review is required for all flagged emails"
        ],
        "human_review_required": True
    }

    return pipeline, le, metadata


def save_model(pipeline, label_encoder, metadata, name):
    """Save model, encoder, and metadata to the model registry."""
    model_dir = MODEL_REGISTRY / name
    model_dir.mkdir(exist_ok=True)

    # Save pipeline
    pipeline_path = model_dir / "pipeline.pkl"
    with open(pipeline_path, 'wb') as f:
        pickle.dump(pipeline, f)

    # Save label encoder
    encoder_path = model_dir / "label_encoder.pkl"
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)

    # Save metadata
    meta_path = model_dir / "metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Saved model to {model_dir}")
    return str(model_dir)


def main():
    logger.info("=" * 60)
    logger.info("CyberShield ML Training Pipeline")
    logger.info("Dataset: SYNTHETIC — Not for real-world accuracy claims")
    logger.info("=" * 60)

    # Train message classifier
    msg_df = load_message_dataset()
    msg_pipeline, msg_le, msg_meta = train_message_classifier(msg_df)
    save_model(msg_pipeline, msg_le, msg_meta, "message_classifier_v1")

    # Train email classifier
    email_df = load_email_dataset()
    email_pipeline, email_le, email_meta = train_email_classifier(email_df)
    save_model(email_pipeline, email_le, email_meta, "email_classifier_v1")

    # Save model registry index
    registry_index = {
        "updated_at": datetime.now().isoformat(),
        "disclaimer": "All models trained on synthetic data. Performance metrics DO NOT represent real-world accuracy.",
        "models": {
            "message_classifier_v1": {
                "active": True,
                "path": "message_classifier_v1",
                "type": msg_meta["model_type"]
            },
            "email_classifier_v1": {
                "active": True,
                "path": "email_classifier_v1",
                "type": email_meta["model_type"]
            }
        }
    }

    with open(MODEL_REGISTRY / "index.json", 'w') as f:
        json.dump(registry_index, f, indent=2)

    logger.info("=" * 60)
    logger.info("Training complete. Models saved to ml/model_registry/")
    logger.info("REMINDER: These metrics are from synthetic data only.")
    logger.info("Do NOT present these as real-world fraud detection accuracy.")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

