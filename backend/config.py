import os

DATABASE_URL = 'postgresql://postgres:1289@localhost:5432/fashionhub'

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
