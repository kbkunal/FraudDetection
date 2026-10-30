"""
CyberShield Database Initialization Script
Creates all tables and seeds initial data.

Run this before starting the application for the first time.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from models.shared import Base as SharedBase
from models.upi import Base as UPIBase
from models.message import Base as MessageBase
from models.email_model import Base as EmailBase
from models.help import Base as HelpBase
from services.help_service import seed_database
from services.auth_service import hash_password
from models.shared import User
import uuid
from datetime import datetime

def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    
    # Create all tables from all Base classes
    SharedBase.metadata.create_all(bind=engine)
    UPIBase.metadata.create_all(bind=engine)
    MessageBase.metadata.create_all(bind=engine)
    EmailBase.metadata.create_all(bind=engine)
    HelpBase.metadata.create_all(bind=engine)
    
    print("[OK] Tables created")

def create_admin_user(db):
    """Create default admin user if not exists."""
    existing = db.query(User).filter(User.email == "admin@cybershield.local").first()
    if existing:
        print("[OK] Admin user already exists")
        return
    
    admin = User(
        id=str(uuid.uuid4()),
        email="admin@cybershield.local",
        username="admin",
        password_hash=hash_password("CyberShield@2024"),
        role="admin",
        created_at=datetime.utcnow(),
        status="active"
    )
    db.add(admin)
    db.commit()
    print("[OK] Admin user created: admin@cybershield.local / CyberShield@2024")
    print("  [!] Change the default password before deployment!")

def main():
    print("=" * 50)
    print("CyberShield Database Initialization")
    print("=" * 50)
    
    init_db()
    
    db = SessionLocal()
    try:
        create_admin_user(db)
        seed_database(db)
        print("[OK] Database seeded successfully")
    finally:
        db.close()
    
    print("=" * 50)
    print("Initialization complete!")
    print("Start the server with: uvicorn main:app --reload --port 8000")
    print("=" * 50)

if __name__ == "__main__":
    main()

