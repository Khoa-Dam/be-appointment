import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
    private readonly logger = new Logger(SupabaseStrategy.name);

    constructor(private readonly configService: ConfigService) {
        const supabaseUrl = configService.get<string>('supabase.url');
        console.log('supabaseUrl', supabaseUrl);

        if (!supabaseUrl) {
            throw new Error('supabase.url must be defined in configuration');
        }

        const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;


        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: jwksUri,
                handleSigningKeyError: (err, cb) => {
                    console.error('❌ Error retrieving public key:', err?.message);
                    return cb(err);
                }
            }),
            algorithms: ['ES256'], // Token mới dùng ES256 (Chuẩn)
        });
    }

    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        return payload;
    }
}