from flask import render_template, current_app, request

def err404(error):
   return render_template("errors/404.html"), 404