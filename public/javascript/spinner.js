$(document).ready(function() {
  const $spinner = $('#spinner');
  const $image = $('#cover');
  
  // Check if image is already loaded
  if ($image[0].complete) {
    $spinner.hide();
    $image.show();
  } 
  else {
    $image.on('load', function() {
      $spinner.hide();
      $image.show();
    });
  }

  $image.on('error', function() {
    $spinner.hide();
  });
});
