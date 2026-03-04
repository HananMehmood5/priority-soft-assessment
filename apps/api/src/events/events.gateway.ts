import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const WS_EVENTS = {
  SCHEDULE_PUBLISHED: 'schedule_published',
  SCHEDULE_UPDATED: 'schedule_updated',
  SWAP_REQUEST: 'swap_request',
  SWAP_RESOLVED: 'swap_resolved',
  DROP_REQUEST: 'drop_request',
  DROP_RESOLVED: 'drop_resolved',
  ASSIGNMENT_CONFLICT: 'assignment_conflict',
  NOTIFICATION: 'notification',
} as const;

@WebSocketGateway({
  cors: { origin: true },
  path: '/socket.io',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  async handleConnection(client: any) {
    try {
      const token = client.handshake?.auth?.token ?? client.handshake?.query?.token;
      if (token) {
        const secret = this.config.get<string>('JWT_SECRET', 'default-secret-change-me');
        const payload = this.jwtService.verify(token, { secret });
        const userId = payload.sub;
        if (userId) {
          client.join(`user:${userId}`);
          client.data = client.data || {};
          client.data.userId = userId;
        }
      }
    } catch {
      // no auth - client can still connect but won't be in user room
    }
    this.logger.debug('Client connected');
  }

  handleDisconnect() {
    this.logger.debug('Client disconnected');
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToLocation(locationId: string, event: string, data: unknown) {
    this.server.to(`location:${locationId}`).emit(event, data);
  }

  /** Client should call subscribe_location with locationId to join */
  subscribeLocation(client: any, locationId: string) {
    client.join(`location:${locationId}`);
  }
}
