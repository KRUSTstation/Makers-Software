from flask import render_template, Blueprint, request, redirect, url_for, flash, session
from database import get_db
from werkzeug.security import generate_password_hash, check_password_hash

bp = Blueprint("pages", __name__)

@bp.route("/")
def home():
    return render_template("pages/home.html", logged_in=session.get("user"))

@bp.route("/about")
def about():
    return render_template("pages/about.html")

@bp.route("/signup", methods=("POST", "GET"))
def signup():
    if request.method == "POST":
        username = request.form.get("username", "").lower()
        password = request.form.get("password", "")
        confirm = request.form.get("cfm-password", "")

        if not username.isalnum():
            flash("Username must be alphanumeric", "error")
        elif len(password) < 8:
            flash("Password must be at least 8 characters", "error")
        elif password != confirm:
            flash("Passwords do not match", "error")
        else:
            db = get_db()
            existing = db.execute(
                "SELECT 1 FROM accounts WHERE username = ?",
                (username,)
            ).fetchone()

            if existing:
                flash("Username already exists", "error")
            else:
                hashed = generate_password_hash(password)
                db.execute(
                    "INSERT INTO accounts (username, password) VALUES (?, ?)",
                    (username, hashed)
                )
                db.commit()
                return redirect(url_for("pages.login"))

    return render_template("login/signup.html")

@bp.route("/login", methods=("POST", "GET"))
def login():
    if request.method == "POST":
        username = request.form.get("username", "").lower()
        password = request.form.get("password", "")

        db = get_db()
        account = db.execute(
            "SELECT username, password FROM accounts WHERE username = ?",
            (username,)
        ).fetchone()

        if account and check_password_hash(account["password"], password):
            session["user"] = account["username"]
            return redirect(url_for("pages.home"))
        else:
            flash("Invalid username or password", "error")

    return render_template("login/login.html")

@bp.route("/logout")
def logout():
    session.clear()
    flash("logged out", category="success")
    return redirect(url_for("pages.home"))

@bp.route("/create", methods=("GET", "POST"))
def create():
    user = session.get("user")
    if not user:
        return redirect(url_for("pages.login"))

    if request.method == "POST":
        message = request.form.get("message", "").strip()

        if message:
            db = get_db()
            db.execute(
                "INSERT INTO post (user, message) VALUES (?, ?)",
                (user, message)
            )
            db.commit()
            flash(f"Thanks for posting, {user}!", "success")
            return redirect(url_for("pages.posts"))
        else:
            flash("Message cannot be empty", "error")

    return render_template("posts/create.html", username=user)

@bp.route("/posts")
def posts():
    db = get_db()
    posts = db.execute(
        "SELECT user, message, created FROM post ORDER BY created DESC"
    ).fetchall()
    return render_template("posts/posts.html", posts=posts)