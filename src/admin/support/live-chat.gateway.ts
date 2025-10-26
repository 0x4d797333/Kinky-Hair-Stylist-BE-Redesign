import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveChatGateway {
  @WebSocketServer()
  server: Server;  

  @SubscribeMessage('sendMessage')
  handleMessage(@MessageBody() message: any) {
    this.server.emit('receiveMessage', message);
  }
}
      