export const config = () => ({
    app: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: process.env.NODE_ENV || 'development',
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    resend: {
        apiKey: process.env.RESEND_API_KEY || '',
        from: process.env.MAIL_FROM || 'Appointment System <onboarding@resend.dev>',
    },
    swagger: {
        path: 'api-docs',
        title: 'Appointment & Schedule System API',
        description: 'API documentation for the appointment booking system',
        version: '1.0',
    },
});
