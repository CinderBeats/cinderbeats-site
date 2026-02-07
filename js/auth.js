function login() {
  localStorage.setItem("vip", "true");
  window.location.href = "members.html";
}

function checkAuth() {
  if (!localStorage.getItem("vip")) {
    window.location.href = "login.html";
  }
}