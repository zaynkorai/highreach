import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Galaxy Lite CRM',
        short_name: 'Galaxy',
        description: 'The Premium Speed to Lead Platform for SMBs.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4F46E5',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    }
}
