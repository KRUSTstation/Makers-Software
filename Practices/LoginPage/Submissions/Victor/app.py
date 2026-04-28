import os
from dotenv import load_dotenv
from flask import Flask
import pages, database, errors

load_dotenv()

def create_app():
   app = Flask(__name__)
   app.config.from_prefixed_env()
   app.secret_key = os.environ.get('SECRET_KEY') or 'a-fallback-default-key'
   
   database.init_app(app)

   app.register_blueprint(pages.bp)
   app.register_error_handler(404, errors.err404)

   print(f"Current environment: {os.getenv("ENVIRONMENT")}")
   print(f"Using Database: {app.config.get("DATABASE")}")

   return app