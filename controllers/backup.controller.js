const prisma = require('../lib/prisma');
const { generateLocalBackup, uploadToCloud, restoreFromBackup } = require('../utils/backup');

// GET /api/backup/cloud/latest
const getLatestCloudBackup = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Find latest cloud backup for user's organization
        // 2. Check if backup exists and is accessible
        // 3. Generate secure download URL
        // 4. Return download URL with expiry

        const latestBackup = await prisma.backup.findFirst({
            where: {
                organizationId: user.organization.id,
                type: 'CLOUD'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!latestBackup) {
            return res.status(404).json({ error: 'No cloud backup found' });
        }

        // Generate secure download URL (implement based on your cloud storage provider)
        const downloadUrl = await generateSecureDownloadUrl(latestBackup.fileUrl);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        res.json({
            downloadUrl,
            expiresAt: expiresAt.toISOString(),
            backupDate: latestBackup.createdAt.toISOString()
        });
    } catch (error) {
        console.error('Get latest cloud backup error:', error);
        res.status(404).json({ error: 'No cloud backup found' });
    }
};

// POST /api/backup/cloud/trigger
const triggerCloudBackup = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Check if manual backup is allowed (rate limiting)
        // 2. Generate backup for user's organization
        // 3. Upload to cloud storage
        // 4. Create backup record in database
        // 5. Return backup details

        // Check rate limiting (one backup per hour)
        const lastBackup = await prisma.backup.findFirst({
            where: {
                organizationId: user.organization.id,
                type: 'CLOUD',
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
                }
            }
        });

        if (lastBackup) {
            return res.status(429).json({ error: 'Backup already created within the last hour' });
        }

        // Generate backup data
        const backupData = await generateLocalBackup(user.organization.id);

        // Upload to cloud storage
        const cloudUrl = await uploadToCloud(backupData, `backup-${user.organization.id}-${Date.now()}.json`);

        // Create backup record
        const backup = await prisma.backup.create({
            data: {
                organizationId: user.organization.id,
                type: 'CLOUD',
                fileUrl: cloudUrl,
                createdBy: userId
            }
        });

        res.json({
            message: 'Cloud backup initiated successfully',
            backupId: backup.id,
            estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        });
    } catch (error) {
        console.error('Trigger cloud backup error:', error);
        res.status(500).json({ error: 'Failed to initiate cloud backup' });
    }
};

// GET /api/backup/local
const downloadLocalBackup = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Generate local backup for user's organization
        // 2. Include all organization data (patients, appointments, EHR, etc.)
        // 3. Create downloadable file (JSON or SQL format)
        // 4. Set appropriate headers for file download
        // 5. Stream backup file to response

        // Generate backup data
        const backupData = await generateLocalBackup(user.organization.id);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="clinic-backup-${user.organization.id}-${Date.now()}.json"`);
        res.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(backupData)));

        // Stream backup data
        res.json(backupData);
    } catch (error) {
        console.error('Generate local backup error:', error);
        res.status(500).json({ error: 'Failed to generate local backup' });
    }
};

// POST /api/backup/restore
const restoreBackup = async (req, res) => {
    try {
        const { backupData } = req.body; // Parsed backup data
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Validate uploaded backup file format
        // 2. Parse and validate backup data structure
        // 3. Check for data conflicts and integrity
        // 4. Create restore point (backup current data)
        // 5. Restore data to organization
        // 6. Log restore operation
        // 7. Return restore summary

        if (!backupData) {
            return res.status(400).json({ error: 'Backup data is required' });
        }

        // Validate backup data structure
        if (!backupData.organization || !backupData.patients || !backupData.appointments) {
            return res.status(400).json({ error: 'Invalid backup data format' });
        }

        // Create restore point (backup current data)
        const currentBackup = await generateLocalBackup(user.organization.id);
        const restorePoint = await prisma.backup.create({
            data: {
                organizationId: user.organization.id,
                type: 'LOCAL',
                fileUrl: JSON.stringify(currentBackup),
                createdBy: userId
            }
        });

        // Restore data
        const restoreResult = await restoreFromBackup(backupData, user.organization.id);

        res.json({
            message: 'Data restored successfully',
            restoredRecords: {
                patients: restoreResult.patients || 0,
                appointments: restoreResult.appointments || 0,
                ehrRecords: restoreResult.ehrRecords || 0
            },
            restoreDate: new Date().toISOString(),
            restorePointId: restorePoint.id
        });
    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(400).json({ error: 'Failed to restore backup' });
    }
};

// GET /api/backup/history
const getBackupHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;

        // Get user's organization
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                organization: true
            }
        });

        if (!user.organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // 1. Get backup history for user's organization
        // 2. Include both cloud and local backup records
        // 3. Return paginated backup history

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const [backups, total] = await Promise.all([
            prisma.backup.findMany({
                where: {
                    organizationId: user.organization.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take,
                include: {
                    organization: {
                        select: {
                            name: true
                        }
                    }
                }
            }),
            prisma.backup.count({
                where: {
                    organizationId: user.organization.id
                }
            })
        ]);

        res.json({
            backups: backups.map(backup => ({
                id: backup.id,
                type: backup.type,
                createdAt: backup.createdAt,
                fileUrl: backup.fileUrl,
                createdBy: backup.createdBy
            })),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get backup history error:', error);
        res.status(500).json({ error: 'Failed to fetch backup history' });
    }
};

// Helper function to generate secure download URL
const generateSecureDownloadUrl = async (fileUrl) => {
    // Implement based on your cloud storage provider (AWS S3, Google Cloud Storage, etc.)
    // This is a placeholder implementation
    return `${fileUrl}?expires=${Date.now() + 24 * 60 * 60 * 1000}`;
};

module.exports = {
    getLatestCloudBackup,
    triggerCloudBackup,
    downloadLocalBackup,
    restoreBackup,
    getBackupHistory
}; 