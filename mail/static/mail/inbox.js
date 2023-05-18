document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector("#compose-form").addEventListener("submit", send);
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  // Gets the emails for the specified user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Loops throught the emails
    emails.forEach(email => {
		const element = document.createElement('div');
		element.id = 'email';
		element.style.display = 'flex';
		element.style.justifyContent = 'space-between';
		element.style.alignItems = 'center';
		element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.100)';
		element.style.borderRadius = '50px';
		element.style.padding = '1.5rem';
		element.style.margin = '1rem 0 1rem 0';
		console.log(email.read);
		if (email.read === 'true') {
			console.log('read true');
			element.style.backgroundColor = 'lightgrey';
		}
		element.innerHTML = `
			<h2 class="fs-5 fw-bolder text-center my-auto mx-3">${email.sender}</h2>
			<h3 class="fs-6 fw-bold text-center my-auto mx-3">${email.subject}</h3>
			<p class="text-center my-auto">${email.timestamp}</p>
		`;


        function handleMouseOver() {
			element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.200)';
		  }
  
		function handleMouseOut() {
			element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.100)';
		  }

		// Email element hover effect
		element.addEventListener('mouseover', handleMouseOver);
		element.addEventListener('mouseout', handleMouseOut);
	
		element.addEventListener('click', () => {
			// Removes the event listeners before calling the message function
			element.removeEventListener('mouseover', handleMouseOver);
			element.removeEventListener('mouseout', handleMouseOut);
			message(email.id);
		  });

		document.querySelector('#emails-view').append(element);

    });

  });

}

function message(id) {
	console.log('id',id);
	fetch(`/emails/${id}`)
	.then(response => response.json())
	.then(email => {
		console.log('email',email);
		console.log(email.sender);
		const message = document.querySelector('#email');
		message.style = 'none';
		message.style.display = 'flex'
		message.style.flexDirection = 'column';
		message.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.100)';
		message.style.borderRadius = '50px';
		message.style.padding = '1.5rem';
		message.style.margin = '1rem 0 1rem 0';
		message.innerHTML = `
			<div class="d-flex justify-content-between align-items-center mx-1">
				<h2 class="my-auto text-center">${email.sender}</h2>
				<p class="my-auto text-center">${email.timestamp}</p>
			</div>
			<div class="mx-3">
				<h3 class="mx-3">${email.subject}</h3>
				<p class="mx-5">${email.body}</p>
			</div>
		`;
	
		if (email.read !== 'True') {

			email.read = true
			readUpdate = {
				"read": true
			}

			// Perform an POST request to save the updated data
			fetch(`/emails/${id}`, {
				method: 'PUT',
				// Updates read to true
				body: JSON.stringify(readUpdate)
			})
			.then(response => response.json())
			.then(result => {
				// Handle the result after the update is complete
				console.log('Update successful:', result);
			})
			.catch(error => {
				// Handle any errors that occur during the update
				console.error('Update failed:', error);
			});
		}

	});
}

function send(event) {
    event.preventDefault();
    // Gets form user input
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    console.log(recipients, subject, body);

    // Passes user input to backend, through the 'email' route, uses the 'compose' views.py function to process and send the message
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          "recipients": recipients,
          "subject": subject,
          "body": body
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        alert('Email Sent!', result);
        load_mailbox('sent');
    });
    
}