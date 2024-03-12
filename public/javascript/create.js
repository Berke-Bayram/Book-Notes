$(document).ready(() => {
  const keywords = [];
  
  $('.keywords').keypress(function(event) {
    if (event.key == 'Enter' && $(this).val().trim() !== '') {
      event.preventDefault();
      const keyword = $(this).val().trim();
      keywords.push(keyword);
      // Clear input field
      $(this).val(''); 
      const keywordElement = $('<span class="keyword"></span>').text(keyword);
      const removeButton = $('<button type="button" class="rm-button">❌</button>');
      keywordElement.append(removeButton); 
      $('.keyword-list').append(keywordElement);
      // Store keywords in a hidden input tag
      $('.keywordArray').val(keywords);
    }
  });

  $('input').keypress(function(event) {
    if (event.key == 'Enter') {
      event.preventDefault();
    }
  });

  // Function to update the hidden input field with the updated keywords array
  function updateKeywordsInput() {
    $('.keywordArray').val(keywords);
  }

  // Function to remove a keyword
  $(document).on("click", ".rm-button", function() {
    var keywordToRemove = $(this).closest('.keyword').text().trim();
    // Remove the button text to look for the keyword text
    keywordToRemove = keywordToRemove.slice(0, -1);
    const indexToRemove = keywords.indexOf(keywordToRemove);
    if (indexToRemove !== -1) {
      keywords.splice(indexToRemove, 1);
      $(this).closest('.keyword').remove();
      updateKeywordsInput();
    }
  });

})



