import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            nombre: any;
            rol: any;
            tenant_id: any;
            tenant_slug: any;
        };
    }>;
    getMe(req: any): Promise<any>;
}
