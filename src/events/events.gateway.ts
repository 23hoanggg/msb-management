// src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[Socket] Client đã kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Client đã ngắt kết nối: ${client.id}`);
  }
}
