from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

ITEMS = []

@app.route('/', methods = ['POST', 'GET'])
def base():
    return render_template('base.html', items=ITEMS)

@app.route('/update', methods=['POST'])
def update():
    toDoItem = request.form.get('ToDo')
    if toDoItem: ITEMS.append(toDoItem)
    return redirect(url_for('base'))

@app.route('/remove', methods=['POST'])
def remove():
    index = int(request.form.get('index'))
    print(index)
    ITEMS.pop(index)
    return redirect(url_for('base'))

if __name__ == "__main__":
    app.run(debug=True)