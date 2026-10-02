#include "bank_service.hpp"

#include <chrono>
#include <ctime>
#include <iomanip>
#include <limits>
#include <sstream>

namespace bank {
namespace {

std::string nowIso8601() {
    const std::time_t t = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    std::tm tm{};
#ifdef _WIN32
    gmtime_s(&tm, &t);
#else
    gmtime_r(&t, &tm);
#endif
    std::ostringstream os;
    os << std::put_time(&tm, "%Y-%m-%dT%H:%M:%SZ");
    return os.str();
}

}  // namespace

BankService::BankService() : rng_(std::random_device{}()) {}

std::string BankService::generateUniqueAccountNumber() {
    std::uniform_int_distribution<std::uint64_t> dist(1'000'000'000ULL, 9'999'999'999ULL);
    std::string number;
    do {
        number = std::to_string(dist(rng_));  // 10-digit number
    } while (accounts_.count(number) != 0);
    return number;
}

Transaction BankService::makeTransaction(TransactionType type, std::int64_t amountCents,
                                         std::int64_t balanceAfterCents) {
    Transaction tx;
    tx.id                = nextTxId_++;
    tx.type              = type;
    tx.amountCents       = amountCents;
    tx.balanceAfterCents = balanceAfterCents;
    tx.timestamp         = nowIso8601();
    return tx;
}

Result<Account> BankService::createAccount(std::string ownerName, std::int64_t initialCents) {
    if (initialCents < 0) return {ErrorCode::InvalidAmount, {}};

    std::lock_guard<std::mutex> lock(mutex_);

    Account acc;
    acc.accountNumber = generateUniqueAccountNumber();
    acc.ownerName     = std::move(ownerName);
    acc.balanceCents  = initialCents;
    acc.createdAt     = nowIso8601();
    if (initialCents > 0) {
        acc.history.push_back(makeTransaction(TransactionType::Opening, initialCents, initialCents));
    }

    accounts_.emplace(acc.accountNumber, acc);
    return {ErrorCode::None, std::move(acc)};
}

Result<Transaction> BankService::deposit(const std::string& accountNumber, std::int64_t cents) {
    if (cents <= 0) return {ErrorCode::InvalidAmount, {}};

    std::lock_guard<std::mutex> lock(mutex_);
    auto it = accounts_.find(accountNumber);
    if (it == accounts_.end()) return {ErrorCode::AccountNotFound, {}};

    Account& acc = it->second;
    if (acc.balanceCents > std::numeric_limits<std::int64_t>::max() - cents) {
        return {ErrorCode::InvalidAmount, {}};  // would overflow
    }
    acc.balanceCents += cents;
    Transaction tx = makeTransaction(TransactionType::Deposit, cents, acc.balanceCents);
    acc.history.push_back(tx);
    return {ErrorCode::None, std::move(tx)};
}

Result<Transaction> BankService::withdraw(const std::string& accountNumber, std::int64_t cents) {
    if (cents <= 0) return {ErrorCode::InvalidAmount, {}};

    std::lock_guard<std::mutex> lock(mutex_);
    auto it = accounts_.find(accountNumber);
    if (it == accounts_.end()) return {ErrorCode::AccountNotFound, {}};

    Account& acc = it->second;
    if (acc.balanceCents < cents) return {ErrorCode::InsufficientFunds, {}};

    acc.balanceCents -= cents;
    Transaction tx = makeTransaction(TransactionType::Withdrawal, cents, acc.balanceCents);
    acc.history.push_back(tx);
    return {ErrorCode::None, std::move(tx)};
}

Result<Account> BankService::getAccount(const std::string& accountNumber) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = accounts_.find(accountNumber);
    if (it == accounts_.end()) return {ErrorCode::AccountNotFound, {}};
    return {ErrorCode::None, it->second};  // copy taken under lock
}

Result<std::vector<Transaction>> BankService::getTransactions(const std::string& accountNumber) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = accounts_.find(accountNumber);
    if (it == accounts_.end()) return {ErrorCode::AccountNotFound, {}};
    return {ErrorCode::None, it->second.history};
}

}  // namespace bank
