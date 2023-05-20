document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);

	// By default, load the inbox
	load_mailbox('inbox');

	document.querySelector("#compose-form").addEventListener('submit', send);
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
		// Initializes an index for every email to assign an id to later
		let index = 0;
		// Loops throught the emails
		emails.forEach(email => {
			console.log('new index',index);
			const element = document.createElement('div');
			// Gives the email an id equal to the current index
			element.id = index;
			element.className = 'email';
			element.style.display = 'flex';
			element.style.justifyContent = 'space-between';
			element.style.alignItems = 'center';
			element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.200)';
			element.style.borderRadius = '50px';
			element.style.padding = '1.5rem';
			element.style.margin = '1rem 0 1rem 0';
			console.log(email.read);

			// Checks if the email is read, if it is, the background color of the div is made grey
			if (email.read === true) {
				console.log('read is true');
				element.style.backgroundColor = 'lightgrey';
			}
			// Renders the relevant contents for the preview message
			element.innerHTML = `
				<h2 class="fs-5 fw-bolder text-center my-auto mx-3">${email.sender}</h2>
				<h3 class="fs-6 fw-bold text-center my-auto mx-3">${email.subject}</h3>
				<p class="text-center my-auto mx-3">${email.timestamp}</p>
			`;

			// Darker shadowing for when a user hovers over the message
			function handleMouseOver() {
				element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.200)';
			}
			// Lighter shadowing for when the user isnt hovering
			function handleMouseOut() {
				element.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.150)';
			}

			// Email element hover effect
			element.addEventListener('mouseover', handleMouseOver);
			element.addEventListener('mouseout', handleMouseOut);
		
			element.addEventListener('click', (event) => {
				// Passes the elements id and message id to message() function when a message is clicked
				message(event.target.id, email.id);
			});

			// Increments the index
			index ++;

			document.querySelector('#emails-view').append(element);

		});

	});

}

// For displaying individual emails
function message(id, emailId) {
	// Fetches from the email/ url, the email matching the given email id
	fetch(`/emails/${emailId}`)
	.then(response => response.json())
	.then(email => {

		// Gets the message content
		const message = document.getElementById(`${id}`);
		// Not a perfect way to do it, but restricts rendering the message if the div element wasnt clicked since the id of each is a number
		if (typeof(id === 'Number')) {
			message.style = 'none';
			message.style.display = 'flex'
			message.style.flexDirection = 'column';
			message.style.boxShadow = '0px 0px 10px 1px rgba(0, 0, 0, 0.150)';
			message.style.borderRadius = '50px';
			message.style.padding = '1.5rem';
			message.style.margin = '1rem 0 1rem 0';
			message.style.height = '70vh'

			// Checks if the message is archives and holds the relevant status for the archive button
			let isArchived
			if (email.archived === false) {
				isArchived = 'Archive';
			}
			else {
				isArchived = 'Unarchive';
			}

			message.innerHTML = `
				<div class="d-flex justify-content-between align-items-center mx-1">
					<h2 class="my-auto text-center">${email.sender}</h2>
					<p class="my-auto text-center">${email.timestamp}</p>
				</div>
				<div class="d-flex flex-column mx-2 my-auto h-75">
					<h3 class="mx-3 pb-4" style="border-bottom: solid 2px grey";">${email.subject}</h3>
					<p class=" mx-5 mt-4 h-100">${email.body}</p>
				</div>
				<button id="archive-bttn" type="button" class="btn btn-primary ml-auto mb-2 mr-3 align-self-end" style="width: 7rem;">${isArchived}</button>
			`;

			// Marks the message as read
			if (email.read !== true) {

				email.read = true;
				const readUpdate = {
					"read": email.read
				}
				// Performs an POST request to save the updated data
				fetch(`/emails/${emailId}`, {
					method: 'PUT',
					// Updates read to true
					body: JSON.stringify(readUpdate)
				})
				.then(response => response.json())
				.then(result => {
					// Handles the result after the update is complete
					console.log('Update successful:', result);
				})
				.catch(error => {
					// Handles any errors that occur during the update
					console.error('Update failed:', error);
				});
			}

			// Targets the archive button
			const archiveBttn = document.querySelector('#archive-bttn');
			// Listens for whe the archive button is clicked
			archiveBttn.addEventListener('click', () => {
				// Passes the email id to the archive() function
				archive(emailId);
			});
		}
	});
}

// Archives the message
function archive(id) {
	fetch(`/emails/${id}`)
	.then(response => response.json())
	.then(email => { 
		// Sets the archive to true or false status based on what it was when clicked
		if (email.archived === false) {
			email.archived = true
		}
		else {
			email.archived = false
		}
		// Updates the archive status
		const archiveUpdate = {
			"archived": email.archived
		}
		// Performs an POST request to save the updated data
		fetch(`/emails/${id}`, {
			method: 'PUT',
			// Updates archive
			body: JSON.stringify(archiveUpdate)
		})
		.then(result => {
			// Handles the result after the update is complete
			console.log('Update successful:', result);
			load_mailbox('inbox');

		})
		.catch(error => {
			// Handles any errors that occur during the update
			console.error('Update failed:', error);
		});
	});
}

// For sending a message
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