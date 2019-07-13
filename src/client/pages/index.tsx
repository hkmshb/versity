const contentStyle = {
  color: "#777",
  width: "600px",
  height: "500px",
  fontSize: "24pt",
  margin: "100px auto 0px",
  textAlign: "center" as "center"
}


function home() {
  return (
    <div style={contentStyle}>
      <span>Welcome to Versity!</span>
    </div>
  );
}

export default home;