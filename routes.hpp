#pragma once
// API layer: HTTP routing, JSON parsing/serialisation, status codes.
#include <crow.h>
#include <crow/middlewares/cors.h>

#include "bank_service.hpp"

namespace bank {

using BankApp = crow::App<crow::CORSHandler>;

void registerRoutes(BankApp& app, BankService& service);

}  // namespace bank
