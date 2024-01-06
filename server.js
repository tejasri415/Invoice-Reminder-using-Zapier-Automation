const express = require("express");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const cors = require("cors");
const session = require("express-session");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const port = 3001;

const secretKey = crypto.randomBytes(32).toString("hex");

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(
  session({
    secret: secretKey,
    resave: true,
    saveUninitialized: true,
  })
);
const users = {};

const GOOGLE_CLIENT_ID =
  "105875839778-1d1lq5pkh2l6kcml55kthfdh3t2fum8o.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      users[profile.id] = profile;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    res.redirect("http://localhost:3000/invoices");
  }
);

app.get("/check-auth", async (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
});

app.get("/api/invoices", async (req, res) => {
  const userId = req.user.id;

  const invoices = [
    {
      id: 1,
      amount: 4000,
      dueDate: "2024-01-10",
      recipient: "Monica Geller",
      email: "mydummymail444@gmail.com",
    },
    {
      id: 2,
      amount: 4000,
      dueDate: "2024-01-15",
      recipient: "Rachel Green",
      email: "rachelitis@gmail.com",
    },
    {
      id: 3,
      amount: 9000,
      dueDate: "2024-01-25",
      recipient: "Ross Geller",
      email: "ross@gmail.com",
    },
    {
      id: 4,
      amount: 25000,
      dueDate: "2024-01-11",
      recipient: "Chandler Bing",
      email: "bing@gmail.com",
    },
    {
      id: 5,
      amount: 40000,
      dueDate: "2024-01-21",
      recipient: "Joey Tribianni",
      email: "joey@gmail.com",
    },
  ];
  res.json(invoices);
});

// app.post("/api/trigger-zapier", async (req, res) => {
//   // Logic to trigger Zapier workflow
//   // You might want to send an HTTP request to Zapier's webhook URL
//   try {
//     // Extract data from the request (you might want to validate or sanitize it)

//     // Make a request to Zapier's API
//     const zapierResponse = await axios.post(
//       "https://hooks.zapier.com/hooks/catch/17524303/3w5vnmp/"
//     );
//     res.json({ message: "Zapier workflow triggered" });
//   } catch (error) {
//     console.error("Error sending reminder:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

const { google } = require("googleapis");

// Function to update Google Spreadsheet
const updateGoogleSpreadsheet = async (invoices) => {
  const sheets = google.sheets("v4");
  const auth = new google.auth.GoogleAuth({
    keyFile:
      "C:/Users/Tejasri/OneDrive/Desktop/invoice-manager-410210-74ff536124d9.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const sheetsApi = await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId: "1nvl-4gOltbemF_GIuLYYBKWnJx2EiYBtxrVR2bC_oZ0",
    range: "Sheet1",
    valueInputOption: "RAW",
    resource: {
      values: invoices.map((invoice) => [
        invoice.amount,
        invoice.dueDate,
        invoice.recipient,
        invoice.email,
      ]),
    },
  });

  console.log("Google Spreadsheet updated:", sheetsApi.data);
};

app.post("/api/trigger-zapier-proxy", async (req, res) => {
  try {
    const zapierResponse = await axios.post(
      "https://hooks.zapier.com/hooks/catch/17524303/3w5vnmp/",
      {},
      { withCredentials: true }
    );

    res.json(zapierResponse.data);
  } catch (error) {
    console.error("Error triggering Zapier workflow:", error);
    res.status(500).json({
      message: "Error triggering Zapier workflow",
      error: error.message,
    });
  }
});

// Update the '/api/trigger-zapier' endpoint
app.post("/api/trigger-zapier", async (req, res) => {
  try {
    // Get due invoices logiv
    const dueInvoices = [
      {
        id: 1,
        amount: 4000,
        dueDate: "2024-01-10",
        recipient: "Monica Geller",
        email: "mydummymail444@gmail.com",
      },
      {
        id: 2,
        amount: 4000,
        dueDate: "2024-01-15",
        recipient: "Rachel Green",
        email: "rachelitis@gmail.com",
      },
      {
        id: 3,
        amount: 9000,
        dueDate: "2024-01-25",
        recipient: "Ross Geller",
        email: "ross@gmail.com",
      },
      {
        id: 4,
        amount: 25000,
        dueDate: "2024-01-11",
        recipient: "Chandler Bing",
        email: "bing@gmail.com",
      },
      {
        id: 5,
        amount: 40000,
        dueDate: "2024-01-21",
        recipient: "Joey Tribianni",
        email: "joey@gmail.com",
      },
    ];

    // Update Google Spreadsheet
    await updateGoogleSpreadsheet(dueInvoices);

    res.json({ message: "Zapier workflow triggered" });
  } catch (error) {
    console.error("Error triggering Zapier workflow:", error);
    res.status(500).json({
      message: "Error triggering Zapier workflow",
      error: error.message,
    });
  }
});

app.get("/user", async (req, res) => {
  if (req.isAuthenticated()) {
    // If the user is authenticated, send the user data
    res.json(req.user);
  } else {
    // If the user is not authenticated, send an empty object or an error message
    res.json({});
  }
});

app.get("/logout", async (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: "Logout error", error: err });
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return res
          .status(500)
          .json({ message: "Session destroy error", error: destroyErr });
      }
      res.clearCookie("connect.sid", { domain: "localhost", path: "/" }); // Update domain and path if needed
      res.json({ message: "Logout successful" });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
