const Client = require("../models/Client");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const getOwned = async (id, userId) => {
  const client = await Client.findById(id);
  if (!client) throw new ApiError(404, "Client not found");
  if (client.user.toString() !== userId) throw new ApiError(403, "Not authorized");
  return client;
};

// @desc    List the user's clients (searchable, paginated)
// @route   GET /api/clients
// @access  Private
exports.getClients = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const filter = { user: req.user.id, deleted: { $ne: true } };
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ clientName: regex }, { email: regex }];
  }
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Client.find(filter).sort({ clientName: 1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);
  res.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// @desc    Create a client
// @route   POST /api/clients
// @access  Private
exports.createClient = asyncHandler(async (req, res) => {
  const {
    clientName,
    email,
    address,
    phone,
    gstin,
    state,
    defaultPaymentTerms,
    defaultNotes,
  } = req.body;
  const client = await Client.create({
    user: req.user.id,
    clientName,
    email,
    address,
    phone,
    gstin,
    state,
    defaultPaymentTerms,
    defaultNotes,
  });
  res.status(201).json(client);
});

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = asyncHandler(async (req, res) => {
  const client = await getOwned(req.params.id, req.user.id);
  [
    "clientName",
    "email",
    "address",
    "phone",
    "gstin",
    "state",
    "defaultPaymentTerms",
    "defaultNotes",
  ].forEach((f) => {
    if (req.body[f] !== undefined) client[f] = req.body[f];
  });
  await client.save();
  res.json(client);
});

// @desc    Move a client to Trash (soft delete)
// @route   DELETE /api/clients/:id
// @access  Private
exports.deleteClient = asyncHandler(async (req, res) => {
  const client = await getOwned(req.params.id, req.user.id);
  client.deleted = true;
  client.deletedAt = new Date();
  await client.save();
  res.json({ message: "Client moved to Trash" });
});

// @desc    List soft-deleted clients (Trash)
// @route   GET /api/clients/trash
// @access  Private
exports.getClientTrash = asyncHandler(async (req, res) => {
  const data = await Client.find({ user: req.user.id, deleted: true })
    .sort({ deletedAt: -1 })
    .limit(200);
  res.json({ data });
});

// @desc    Restore a client from Trash
// @route   POST /api/clients/:id/restore
// @access  Private
exports.restoreClient = asyncHandler(async (req, res) => {
  const client = await getOwned(req.params.id, req.user.id);
  client.deleted = false;
  client.deletedAt = undefined;
  await client.save();
  res.json({ message: "Client restored", client });
});

// @desc    Permanently delete a client
// @route   DELETE /api/clients/:id/permanent
// @access  Private
exports.purgeClient = asyncHandler(async (req, res) => {
  const client = await getOwned(req.params.id, req.user.id);
  await client.deleteOne();
  res.json({ message: "Client permanently deleted" });
});
