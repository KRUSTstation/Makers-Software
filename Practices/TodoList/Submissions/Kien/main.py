from flask import Flask, render_template, request

app = Flask(__name__, template_folder='htmlfiles')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    restricted = request.form['restricted']
    legendary = request.form['legendary']
    non_legendary = request.form['non-legendary']
    return render_template('landing_page.html', restricted=restricted, legendary=legendary, non_legendary=non_legendary)

app.run()