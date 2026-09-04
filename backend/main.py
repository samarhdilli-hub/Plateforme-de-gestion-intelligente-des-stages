from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import (
    auth,
    stagiaires,
    sujets,
    affectations,
    evaluations,
    recommandations,
    utilisateurs,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plateforme intelligente de gestion des stages",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Santé"])
def accueil():
    return {
        "message": "API Plateforme de gestion des stages fonctionne"
    }


app.include_router(auth.router)
app.include_router(stagiaires.router)
app.include_router(sujets.router)
app.include_router(affectations.router)
app.include_router(evaluations.router)
app.include_router(recommandations.router)
app.include_router(utilisateurs.router)
