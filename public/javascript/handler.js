$(document).ready(() => {
  const elements = $('.prevArray').val();
  const keywords = (elements == '' || elements == null) ? new Set() : new Set(elements.split(','));
  
  $('.keywords').keypress(function(event) {
    if (event.key == 'Enter' && $(this).val().trim() !== '') {
      event.preventDefault();
      const keyword = $(this).val().trim();
      keywords.add(keyword);
      // Clear input field
      $(this).val(''); 
      const keywordElement = $('<span class="keyword"></span>');
      const keywordText = $('<span class="keywordText"></span>').text(keyword);
      const removeButton = $('<button type="button" class="rm-button">❌</button>');
      keywordElement.append(keywordText);
      keywordElement.append(removeButton);
      $('.keyword-list').append(keywordElement);
    }
  });

  $('input').keypress(function(event) {
    if (event.key == 'Enter') {
      event.preventDefault();
    }
  });

  // Function to update the hidden input field with the updated keywords array
  function updateKeywordsInput() {
    $('.keywordArray').val(Array.from(keywords));
  }

  // While sending the form, update the hidden input tag
  $('.main-btn').click(() => {
    updateKeywordsInput();
  })

  // Remove handler
  $(document).on("click", ".rm-button", function() {
    var keywordToRemove = $(this).siblings('.keywordText').text().trim();
    console.log(keywordToRemove);
    // Remove the keyword from the set
    keywords.delete(keywordToRemove);
    // Also remove it from frontend and update the value of hidden input
    $(this).parent().remove();
  });

})



