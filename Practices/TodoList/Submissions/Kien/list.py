from flask import Flask, render_template, request

app = Flask(__name__, template_folder='htmlfiles')

@app.route('/')
def index():
    return render_template('to-do-list.html')

tasks = []

@app.route('/submit', methods=['POST'])
def submit():
    if request.method == 'POST':
        task = request.form['task']
        tasks.append(task)
    return render_template('to-do-list.html', tasks=tasks)

@app.route('/delete', methods=['DELETE', 'POST'])
def delete():
    index = int(request.form['index'])
    if 0 <= index < len(tasks):
        tasks.pop(index)
    return render_template('to-do-list.html', tasks=tasks)

app.run()