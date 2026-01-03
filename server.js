// server.js - Main server for tunzymd-webpair
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Ensure temp directory exists
const ensureTempDir = async () => {
    const tempDir = path.join(__dirname, 'temp');
    try {
        await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
        console.log('Temp directory already exists');
    }
};

// Home route - serve the pairing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for pairing
app.post('/api/pair', async (req, res) => {
    try {
        await ensureTempDir();
        
        const { number } = req.body;
        
        // Validate input
        if (!number || number.length < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please enter a valid phone number (minimum 10 digits)' 
            });
        }

        // Generate session ID
        const sessionId = `TUNZYMD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
        
        // Create creds.json data structure
        const credsData = {
            userNumber: number.toString(),
            pairingCode: "TUNZYMD1",
            sessionId: sessionId,
            appName: "TUNZYMD1 Bot",
            platform: "WhatsApp MD",
            version: "2.0.1",
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "active",
            features: ["multi-device", "encrypted", "cloud-sync"]
        };

        // Create filename
        const fileName = `creds_${number}_${Date.now()}.json`;
        const filePath = path.join(__dirname, 'temp', fileName);
        
        // Write to file
        await fs.writeFile(filePath, JSON.stringify(credsData, null, 2));
        
        // Upload to Mega.nz (using your mega.js)
        let downloadLink;
        try {
            // Import your mega.js module
            const megaModule = require('./mega.js');
            if (megaModule && typeof megaModule.uploadFile === 'function') {
                downloadLink = await megaModule.uploadFile(filePath, fileName);
            } else {
                // Fallback to local download
                downloadLink = `${req.protocol}://${req.get('host')}/download/${fileName}`;
            }
        } catch (megaError) {
            console.log('Mega upload failed, using local download:', megaError.message);
            downloadLink = `${req.protocol}://${req.get('host')}/download/${fileName}`;
        }

        // Create WhatsApp message for user
        const whatsappMessage = `
🎯 *TUNZYMD1 PAIRING SUCCESSFUL!*

✅ *Your Session File is Ready*
📁 Download: ${downloadLink}

🔑 *Your Pairing Code:* \`TUNZYMD1\`

📋 *Session Details:*
• Number: ${number}
• Session ID: ${sessionId}
• Generated: ${new Date().toLocaleString()}

🎬 *NEXT STEP - WATCH TUTORIAL:*
🔗 https://youtu.be/uF7DBNoKWdU?si=fTZ1xRwHXzdh1M2n

⚠️ *IMPORTANT:* Watch the complete tutorial to learn how to use your session file.

🔄 *Need help?* Contact support if you face any issues.

Thank you for using TUNZYMD1 System! 🚀
        `.trim();

        // Return success response
        res.json({
            success: true,
            message: 'Session file created successfully',
            userMessage: whatsappMessage, // Send this to user's WhatsApp
            downloadLink: downloadLink,
            sessionId: sessionId,
            pairingCode: "TUNZYMD1",
            data: credsData,
            videoLink: "https://youtu.be/uF7DBNoKWdU?si=fTZ1xRwHXzdh1M2n"
        });

        // Clean up temp file after 1 hour
        setTimeout(async () => {
            try {
                await fs.unlink(filePath);
                console.log(`Cleaned up temp file: ${fileName}`);
            } catch (cleanupError) {
                // File might already be deleted
            }
        }, 3600000); // 1 hour

    } catch (error) {
        console.error('Pairing error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create session file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Download endpoint for local files
app.get('/download/:filename', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'temp', req.params.filename);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'File not found or expired' });
        }
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="creds.json"`);
        
        // Stream the file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        service: 'tunzymd-webpair',
        version: '2.0.1',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ┌──────────────────────────────────────┐
    │    🚀 TUNZYMD-WEBPAIR SERVER        │
    │                                      │
    │    🔗 Local: http://localhost:${PORT}  │
    │    📺 Tutorial: YouTube Link        │
    │    🕒 Started: ${new Date().toLocaleTimeString()}  │
    └──────────────────────────────────────┘
    `);
});
