from flask import Blueprint, render_template, request, redirect, url_for, flash
from database import get_db

bp = Blueprint("posts", __name__)

@bp.route("/", methods=["GET", "POST"])
def todolist():
   if request.method == "POST":
      task = request.form["task"]
      if task:
         db = get_db()
         db.execute(
            "INSERT INTO todolist (task) VALUES (?)",
            (task,)
         )
         db.commit()
         flash(f"{task} added, do it soon probably", category="success")
         return redirect(url_for("posts.todolist"))
      else:
         flash(f"Message cannot be empty", category="error")
      
   db = get_db()
   tasks = db.execute(
      "SELECT * FROM todolist ORDER BY created DESC"
   ).fetchall()
   return render_template("posts/todolist.html", tasks = tasks)

@bp.route("/delete/<int:id>", methods=["POST"])
def delete(id):
   db = get_db()
   db.execute("DELETE FROM todolist WHERE id = (?)", (id,))
   db.commit()
   flash(f"task {id} deleted", category="success")
   return redirect(url_for("posts.todolist"))