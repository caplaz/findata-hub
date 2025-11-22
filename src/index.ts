/**
 * Alternative server entry point
 * Simple startup script that imports and starts the main Express server
 *
 * @module index
 */

import app from "./server";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
