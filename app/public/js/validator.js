function validateZip() {
  var file_name = document.getElementById("file").value;
  var Extension = file_name.substring(file_name.lastIndexOf('.') + 1).toLowerCase();
  var submit = document.getElementById("submit");
  if( Extension == "zip")
  {
  submit.disabled = false;
  document.getElementById("error").innerHTML = "";
  }
  else
  {
  submit.disabled = true;
  document.getElementById("error").innerHTML = "Can not upload other than .zip files.";
  }
}
function validateForm(){
  var form=document.forms["Form"]["file"].value;
  if (form==null || form=="")
  {
    alert("Please select one file.");
    return false;
  }
}