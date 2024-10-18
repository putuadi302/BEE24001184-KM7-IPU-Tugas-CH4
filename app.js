const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const port = 3000;
app.use(express.json());

// CRUD untuk User

// 1. Menambahkan user baru beserta profilnya
app.post('/api/v1/users', async (req, res) => {
    const { name, email, password, profile } = req.body;

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            profile: {
                create: profile,
            },
        },
    });

    res.status(201).json(user);
});

// 2. Menampilkan daftar users
app.get('/api/v1/users', async (req, res) => {
    const users = await prisma.user.findMany({
        include: { profile: true },
    });

    res.json(users);
});

// 3. Menampilkan detail informasi user
app.get('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: { profile: true }
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
});

// 4. Mengupdate informasi user
app.put('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, password, profile } = req.body;

    const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
            name,
            email,
            password,
            profile: {
                update: profile,
            }
        }
    });

    res.json(user);
});

// 5. Menghapus user
app.delete('/api/v1/users/:userId', async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.user.delete({
        where: { id: parseInt(userId) },
    });

    res.json({ message: 'User deleted', user });
});

// CRUD untuk BankAccount

// 1. Menambahkan akun baru ke user
app.post('/api/v1/accounts', async (req, res) => {
    const { bank_name, bank_account_number, balance, userId } = req.body;

    const account = await prisma.bankAccount.create({
        data: {
            bank_name,
            bank_account_number,
            balance,
            user: { connect: { id: userId } },
        },
    });

    res.status(201).json(account);
});

// 2. Menampilkan daftar akun
app.get('/api/v1/accounts', async (req, res) => {
    const accounts = await prisma.bankAccount.findMany();

    res.json(accounts);
});

// 3. Menampilkan detail akun
app.get('/api/v1/accounts/:accountId', async (req, res) => {
    const { accountId } = req.params;

    const account = await prisma.bankAccount.findUnique({
        where: { id: parseInt(accountId) },
    });

    if (!account) {
        return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
});

// 4. Mengupdate akun
app.put('/api/v1/accounts/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const { bank_name, bank_account_number, balance } = req.body;

    const account = await prisma.bankAccount.update({
        where: { id: parseInt(accountId) },
        data: {
            bank_name,
            bank_account_number,
            balance,
        },
    });

    res.json(account);
});

// 5. Menghapus akun
app.delete('/api/v1/accounts/:accountId', async (req, res) => {
    const { accountId } = req.params;

    const account = await prisma.bankAccount.delete({
        where: { id: parseInt(accountId) },
    });

    res.json({ message: 'Account deleted', account });
});

// CRUD untuk Transaction

// 1. Mengirimkan uang dari 1 akun ke akun lain
app.post('/api/v1/transactions', async (req, res) => {
    const { sourceAccountId, destinationAccountId, amount } = req.body;

    const transaction = await prisma.transaction.create({
        data: {
            sourceAccount: { connect: { id: sourceAccountId } },
            destinationAccount: { connect: { id: destinationAccountId } },
            amount,
        },
    });

    // Update saldo pada akun
    await prisma.bankAccount.update({
        where: { id: sourceAccountId },
        data: { balance: { decrement: amount } },
    });

    await prisma.bankAccount.update({
        where: { id: destinationAccountId },
        data: { balance: { increment: amount } },
    });

    res.status(201).json(transaction);
});

// 2. Menampilkan daftar transaksi
app.get('/api/v1/transactions', async (req, res) => {
    const transactions = await prisma.transaction.findMany({
        include: {
            sourceAccount: true,
            destinationAccount: true,
        },
    });

    res.json(transactions);
});

// 3. Menampilkan detail transaksi
app.get('/api/v1/transactions/:transactionId', async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(transactionId) },
        include: {
            sourceAccount: true,
            destinationAccount: true,
        },
    });

    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
});

// 4. Mengupdate transaksi (misalnya, hanya mengubah jumlah)
app.put('/api/v1/transactions/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const { amount } = req.body;

    const transaction = await prisma.transaction.update({
        where: { id: parseInt(transactionId) },
        data: { amount },
    });

    res.json(transaction);
});

// 5. Menghapus transaksi
app.delete('/api/v1/transactions/:transactionId', async (req, res) => {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.delete({
        where: { id: parseInt(transactionId) },
    });

    res.json({ message: 'Transaction deleted', transaction });
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
