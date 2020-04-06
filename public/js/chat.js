const socket = io()

// elements

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-tempalate').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How for have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

} 


socket.on('Message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('H:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    
    //disable
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{
      
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()   //enable
        if(error) {
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

$sendLocationButton.addEventListener('click',(e)=>{
    
    $sendLocationButton.setAttribute('disabled','disabled')

    if(!navigator.geolocation) {
        return alert('Geolaction is not supprted by your browser')
    }

    navigator.geolocation.getCurrentPosition((position)=>{
        const location = {
            longitude:position.coords.longitude,
            latitude:position.coords.latitude
        }
        socket.emit('sendLocation',location,()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
        
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error) {
        alert(error)
        location.href = '/'
    }
})