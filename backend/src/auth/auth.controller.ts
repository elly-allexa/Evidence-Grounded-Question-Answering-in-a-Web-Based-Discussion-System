import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const token = await this.authService.createAccessToken(req.user);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: JwtUser) {
    return this.authService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, callback) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(
            file.originalname,
          )}`;
          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
          callback(new Error('Only PNG, JPG, JPEG, and WEBP images are allowed.'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadAvatar(@CurrentUser() user: JwtUser, @UploadedFile() file: Express.Multer.File) {
    return this.authService.updateAvatar(user.id, file.filename);
  }
}
