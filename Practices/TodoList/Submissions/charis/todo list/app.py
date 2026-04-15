from flask import Flask,render_template,request,redirect,url_for
app = Flask(__name__)

tasks=[['a','b','c'],['a','b','c']]

@app.route("/")
def index():
    return render_template('index.html',tasks=tasks)

@app.route("/add",methods=['POST'])
def add_task():
    newtask = []
    newtask.append(request.form.get('task'))
    newtask.append(request.form.get('category'))
    newtask.append(request.form.get('date'))
    tasks.append(newtask)
    return redirect(url_for('index'))

@app.route("/delete",methods=['POST'])
def delete_task():
    task = request.form.get('delete')
    print(task)
    del tasks[int(task)]
    return redirect(url_for('index'))


if __name__ == "__main__":
    app.run(debug=True)