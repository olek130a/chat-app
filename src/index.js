const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage}= require('./utils/messages')
const {getUser,removeUser,getUsersInRoom,addUser} = require ('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))



io.on('connection',(socket)=>{
    socket.on('join',({username,room},callback)=>{
        const {error,user} = addUser({id:socket.id,username,room})

        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('Message',generateMessage("Admin",'Welcome'))
        socket.broadcast.to(user.room).emit('Message',generateMessage("Admin",`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })
    
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Proszę nie przeklinać')
        }
        io.to(user.room).emit('Message',generateMessage(user.username,message))
        callback()
        })

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('Message',generateMessage("Admin",`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    }) 
})

server.listen(port, () => {
    console.log('server is up on port ' + port)
})
