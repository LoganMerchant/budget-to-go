// Holds IndexedDB connection
let db;
// Database title and version number
const request = indexedDB.open("budget-to-go", 1);

request.onupgradeneeded = function (event) {
  // The db will be the database with a higher version number i.e. be created.
  db = event.target.result;

  db.createObjectStore("new_budget_transactions", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.online) {
    postSavedTransactions();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_budget_transactions"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget_transactions");

  budgetObjectStore.add(record);
}

function postSavedTransactions() {
  const transaction = db.transaction(["new_budget_transactions"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget_transactions");

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "post",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(
            ["new_budget_transactions"],
            "readwrite"
          );

          const budgetObjectStore = transaction.objectStore(
            "new_budget_transactions"
          );

          budgetObjectStore.clear();

          console.log("All saved transactions were successfully posted.");
        })
        .catch((err) => console.log(err));
    }
  };
}

window.addEventListener("online", postSavedTransactions);
