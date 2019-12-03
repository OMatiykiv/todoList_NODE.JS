const express = require('express');
const fs = require('fs');
const helmet = require('helmet');
const Joi = require('joi');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;
app.use(helmet());
const schema = Joi.object().keys({ 
    task: Joi.string().required(),
    _id: Joi.number().integer(), 
    done: Joi.boolean()
});
let tasks = JSON.parse(fs.readFileSync("todoList.json", "utf8")) || [];

//bodyParser
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());


//middleware
app.use('', (req, res, next) => {
    if(req.headers.authorization === '123') {
        console.log('AUTH SUCCESS');
        next();
    } else {
        console.log('AUTH FAILED');
        next({status: 403, error: 'ERROR AUTH'});
    }
    next();
})

//methods
let addTodo = (req, res) => {
    const newTask = {
        task: req.body.task,
        _id: +new Date(),
        done: req.body.done == 'true' || false
    }
    const result = Joi.validate(newTask, schema); 
    if(result.error !== null) {
        res.status(400).json({ 
            message: result.error.message
        }) 
    } else {
      tasks.push(newTask);
      res.status(201).json(newTask);
      fs.writeFileSync("todoList.json", `${JSON.stringify(tasks)}`);
    }  
}
let getTodos = (req, res) => res.status(200).json(tasks);
let removeTodo = (req, res) => {
    let exist;
    tasks = tasks.filter(task => {
        if (task._id !== +req.params.id) {
            return true;           
        } else {
            exist = true;
        }
    })
    if(!exist) {
        res.status(400).json({
            message: `Task ${req.params.id} doesn't exist, check ID one more time and try again`
        })
    } else {
        res.status(200).json({
            message: `Task '${req.params.id}' was deleted`
        })
        fs.writeFileSync("todoList.json", `${JSON.stringify(tasks)}`)
    }
}
let markDone = (req, res) => {
    let exist;
    tasks = tasks.map(task => {
        if(task._id === +req.params.id) {
            task.done = true;
            exist = true;
        }
        return task;
    })
    if(!exist) {
        res.status(400).json({
            message: `Task ${req.params.id} doesn't exist, check ID one more time and try again`
        })
    } else {
        res.status(200).json({
            message: `Task '${req.params.id}' was marked as DONE`
        })
        fs.writeFileSync("todoList.json", `${JSON.stringify(tasks)}`)
    }
}
let markUndone = (req, res) => {
    let exist;
    tasks = tasks.map(task => {
        if(task._id === +req.params.id) {
            task.done = false
            exist = true;
        }
        return task;
    })
    if(!exist) {
        res.status(400).json({
            message: `Task ${req.params.id} doesn't exist, check ID one more time and try again`
        })
    } else {
        res.status(200).json({
            message: `Task '${req.params.id}' was marked as UNDONE`
        })
        fs.writeFileSync("todoList.json", `${JSON.stringify(tasks)}`)
    }
}

//http methods
app.get('/tasks', getTodos);
app.post('/tasks', addTodo);
app.delete('/tasks/:id', removeTodo);
app.put('/tasks/:id/done', markDone);
app.put('/tasks/:id/undone', markUndone);
app.all('*', (req, res) => {
    res.status(404).json({
        message: `Sorry page not found`
    })
  });


app.use((err, req, res, next) => {
    console.log(`From error handler:`, err);
    res.status(500).json(err);
})

app.listen(port, () => console.log(`Port listening on port ${port}`))