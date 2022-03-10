import { createInstance } from '@rivalis/boot'
import MyFirstRoom from './rooms/MyFirstRoom'

createInstance(instance => {
    instance.rooms.define('myFirstRoom', MyFirstRoom)
})