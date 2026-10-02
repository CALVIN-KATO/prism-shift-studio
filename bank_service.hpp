#pragma once
// Business logic layer. Thread-safe; knows nothing about HTTP or JSON.
#include <cstdint>
#include <mutex>
#include <random>
#include <string>
#include <unordered_map>
#include <vector>

#include "models.hpp"

namespace bank {

enum class ErrorCode { None, InvalidAmount, AccountNotFound, InsufficientFunds };

template <typename T>
struct Result {
    ErrorCode error{ErrorCode::None};
    T         value{};
    bool ok() const { return error == ErrorCode::None; }
};

class BankService {
public:
    BankService();

    Result<Account>                  createAccount(std::string ownerName, std::int64_t initialCents);
    Result<Transaction>              deposit(const std::string& accountNumber, std::int64_t cents);
    Result<Transaction>              withdraw(const std::string& accountNumber, std::int64_t cents);
    Result<Account>                  getAccount(const std::string& accountNumber) const;
    Result<std::vector<Transaction>> getTransactions(const std::string& accountNumber) const;

private:
    std::string generateUniqueAccountNumber();  // requires mutex_ held
    Transaction makeTransaction(TransactionType type, std::int64_t amountCents,
                                std::int64_t balanceAfterCents);  // requires mutex_ held

    mutable std::mutex                         mutex_;
    std::unordered_map<std::string, Account>   accounts_;
    std::uint64_t                              nextTxId_{1};
    std::mt19937_64                            rng_;
};

}  // namespace bank
