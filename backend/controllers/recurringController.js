const RecurringInvoice = require("../models/RecurringInvoice");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { generateInvoice, advance } = require("../utils/recurringRunner");

const getOwned = async (id, userId) => {
  const r = await RecurringInvoice.findById(id);
  if (!r) throw new ApiError(404, "Recurring invoice not found");
  if (r.user.toString() !== userId) throw new ApiError(403, "Not authorized");
  return r;
};

// @desc    List recurring templates
// @route   GET /api/recurring
// @access  Private
exports.getRecurring = asyncHandler(async (req, res) => {
  const data = await RecurringInvoice.find({ user: req.user.id }).sort({
    createdAt: -1,
  });
  res.json({ data });
});

// @desc    Create a recurring template
// @route   POST /api/recurring
// @access  Private
exports.createRecurring = asyncHandler(async (req, res) => {
  const {
    billFrom,
    billTo,
    items,
    notes,
    paymentTerms,
    theme,
    discount,
    frequency,
    startDate,
    endDate,
    maxOccurrences,
    autoEmail,
  } = req.body;

  const recurring = await RecurringInvoice.create({
    user: req.user.id,
    billFrom: billFrom || {
      businessName: req.user.businessName,
      email: req.user.email,
      address: req.user.address,
      phone: req.user.phone,
    },
    billTo,
    items,
    notes,
    paymentTerms,
    theme,
    discount,
    frequency,
    nextRun: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : undefined,
    maxOccurrences: maxOccurrences || undefined,
    autoEmail: Boolean(autoEmail),
    active: true,
  });

  res.status(201).json(recurring);
});

// @desc    Update a recurring template (pause/resume, change schedule)
// @route   PUT /api/recurring/:id
// @access  Private
exports.updateRecurring = asyncHandler(async (req, res) => {
  const r = await getOwned(req.params.id, req.user.id);
  [
    "frequency",
    "notes",
    "paymentTerms",
    "theme",
    "active",
    "maxOccurrences",
    "autoEmail",
  ].forEach((f) => {
    if (req.body[f] !== undefined) r[f] = req.body[f];
  });
  if (req.body.nextRun !== undefined) r.nextRun = new Date(req.body.nextRun);
  if (req.body.endDate !== undefined) r.endDate = new Date(req.body.endDate);
  await r.save();
  res.json(r);
});

// @desc    Delete a recurring template
// @route   DELETE /api/recurring/:id
// @access  Private
exports.deleteRecurring = asyncHandler(async (req, res) => {
  const r = await getOwned(req.params.id, req.user.id);
  await r.deleteOne();
  res.json({ message: "Recurring invoice deleted" });
});

// @desc    Generate an invoice from this template right now
// @route   POST /api/recurring/:id/run
// @access  Private
exports.runRecurringNow = asyncHandler(async (req, res) => {
  const r = await getOwned(req.params.id, req.user.id);
  const invoice = await generateInvoice(r, new Date());
  r.lastRun = new Date();
  r.nextRun = advance(r.nextRun, r.frequency);
  r.generatedCount += 1;
  await r.save();
  res.status(201).json({ invoice, recurring: r });
});
