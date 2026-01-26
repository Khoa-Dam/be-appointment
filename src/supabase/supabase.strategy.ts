import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly configService: ConfigService) {
        const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');

        if (!jwtSecret) {
            throw new Error('SUPABASE_JWT_SECRET must be defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            // Lưu ý: SUPABASE_JWT_SECRET khác với SUPABASE_KEY (Anon Key)
        });
    }

    async validate(payload: any) {
        // Payload là dữ liệu đã giải mã từ Token
        // Bạn có thể check thêm logic check user bị ban/block ở đây nếu cần
        if (!payload) {
            throw new UnauthorizedException();
        }
        // Giá trị return ở đây sẽ được gán vào `request.user`
        return payload;
    }
}
