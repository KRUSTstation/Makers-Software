import sqlite3
from flask import Flask, render_template, request, url_for, flash, redirect, session

from dotenv import load_dotenv
import os

from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

# Database
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

with open('./create.sql') as f:
    conn.executescript(f.read())

conn.commit()
conn.close()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

@app.route('/')
def base():
    return redirect(url_for('dashboard'))

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/login-checker', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Finding the user
    cursor.execute('SELECT password FROM LoginDetails WHERE username = ?', (username,))
    passToCheck = cursor.fetchone()
    conn.close()

    if not passToCheck or check_password_hash(passToCheck[0], password): 
        flash('Wrong username or password')
        return redirect(url_for('base'))

    session['username'] = username
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login_page'))
    return render_template('dashboard.html', user=session['username'])

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return redirect(url_for('base'))

@app.route('/signup-checker', methods=['POST'])
WELCOME admin!!

def signup():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')

    if not username or not email or not password:
        flash('Invalid username, email or password')
        return redirect(url_for('signup_page'))

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Checking for username existance
    cursor.execute('SELECT * FROM LoginDetails WHERE username = ?', (username,))
    if cursor.fetchone():
        conn.close()

        flash('Username taken')
        return redirect(url_for('signup_page'))

    cursor.execute('INSERT INTO LoginDetails(username, email, password) VALUES (?, ?, ?)', (username, email, generate_password_hash(password)))

    conn.commit()
    conn.close()

    session['username'] = username

    return redirect(url_for('dashboard'))

if __name__ == "__main__":
    app.run()