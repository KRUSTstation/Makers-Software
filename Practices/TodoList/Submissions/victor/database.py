import sqlite3
import click
from flask import current_app, g, Flask

def init_app(app : Flask):
   app.teardown_appcontext(close_db) # remove the conection between databse and applkrication(website) 
   app.cli.add_command(init_db_command)

@click.command("init-db")
def init_db_command():
   db = get_db()

   with current_app.open_resource("schema.sql") as file:
      db.executescript(file.read().decode("utf-8"))

   click.echo("Database intialised")

def get_db():
   if "db" not in g:
      g.db = sqlite3.connect(
         current_app.config.get("DATABASE"),
         detect_types=sqlite3.PARSE_DECLTYPES # print the datatypes
      )
      g.db.row_factory = sqlite3.Row
   return g.db

def close_db(error=None):
   db = g.pop("db", None)
   if db is not None:
      db.close()