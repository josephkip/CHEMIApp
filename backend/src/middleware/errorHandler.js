function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.type === 'not_found') {
    return res.status(404).json({ error: err.message });
  }

  if (err.type === 'conflict') {
    return res.status(409).json({ error: err.message });
  }

  if (err.type === 'unauthorized') {
    return res.status(401).json({ error: err.message });
  }

  if (err.type === 'forbidden') {
    return res.status(403).json({ error: err.message });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with this value already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  res.status(500).json({
    error: 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
}

module.exports = errorHandler;
