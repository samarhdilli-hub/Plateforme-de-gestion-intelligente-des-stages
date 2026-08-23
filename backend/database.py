import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Charge les variables définies dans le fichier .env (à la racine du
# backend, à côté de ce fichier). Ce fichier ne doit JAMAIS être committé
# dans Git — voir .env.example pour le modèle à copier.
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "La variable d'environnement DATABASE_URL n'est pas définie. "
        "Créez un fichier .env à la racine du backend en vous basant sur "
        ".env.example, puis renseignez-y votre chaîne de connexion "
        "PostgreSQL."
    )

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()