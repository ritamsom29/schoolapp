from .session import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import *

def init_db():
    print('Creating database tables...')
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully.')

def reset_db():
    print('Dropping all tables...')
    Base.metadata.drop_all(bind=engine)
    print('Recreating database tables...')
    Base.metadata.create_all(bind=engine)
    print('Database tables reset successfully.')
