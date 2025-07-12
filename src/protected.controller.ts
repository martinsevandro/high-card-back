import { Controller, Get, UseGuards, Request} from '@nestjs/common';
// import { Request as ExpressRequest } from 'express';
import { RequestWithUser } from './auth/types/request-with-user';
import { AuthGuard } from '@nestjs/passport';

@Controller('protected')
export class ProtectedController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getProtected(@Request() req: RequestWithUser) {
    return {
      message: 'Acesso autorizado à rota protegida',
      user: req.user,
    };
  }
}
