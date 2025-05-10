// Wait until the DOM is fully loaded before running any script logic
document.addEventListener('DOMContentLoaded', function () {
  // Set up event listeners for mailbox navigation
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));

  // Set up event listener for composing a new email
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // Set up event listener for form submission to send email
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

// Display the email composition form
function compose_email(recipients = '', subject = '', body = '') {
  // Hide other views and show the compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Fill in the fields (used when replying)
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

// Send the composed email using a POST request
function send_email(event) {
  event.preventDefault();  // Prevent form submission from reloading the page

  // Make the API call to send the email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => response.json())
    .then(result => {
      // Once sent, redirect to the Sent mailbox
      load_mailbox('sent');
    });
}

// Load the selected mailbox and display its emails
function load_mailbox(mailbox) {
  // Show the mailbox view and hide others
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  const view = document.querySelector('#emails-view');
  view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails from the selected mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Render each email in a bordered div
      emails.forEach(email => {
        const div = document.createElement('div');
        div.className = 'email-entry';
        div.style.border = '1px solid #ccc';
        div.style.padding = '10px';
        div.style.marginBottom = '5px';
        div.style.backgroundColor = email.read ? '#f0f0f0' : 'white';
        div.innerHTML = `<strong>${email.sender}</strong> - ${email.subject} <span style="float:right">${email.timestamp}</span>`;
        div.addEventListener('click', () => view_email(email.id));
        view.appendChild(div);
      });
    });
}

// Display full details of a selected email
function view_email(id) {
  // Show only the email detail view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  const detailView = document.querySelector('#email-detail-view');
  detailView.style.display = 'block';
  detailView.innerHTML = '';  // Clear previous content

  // Get the full email data
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Mark the email as read
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });

      // Create the email content
      const container = document.createElement('div');
      container.innerHTML = `
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr />
        <p>${email.body}</p>
        <hr />
      `;

      // If this is not the user's own sent message, allow archiving/unarchiving
      if (email.sender !== document.querySelector('#user-email')?.innerText) {
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-sm btn-outline-primary';
        archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive';
        archiveButton.addEventListener('click', () => {
          // Toggle the archived state
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived })
          }).then(() => load_mailbox('inbox'));  // Reload inbox after update
        });
        container.appendChild(archiveButton);
      }

      // Add reply button
      const replyButton = document.createElement('button');
      replyButton.className = 'btn btn-sm btn-outline-success';
      replyButton.textContent = 'Reply';
      replyButton.addEventListener('click', () => {
        // Pre-fill subject and body for reply
        let subject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
        let body = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
        compose_email(email.sender, subject, body);
      });
      container.appendChild(replyButton);

      // Add all content to detail view
      detailView.appendChild(container);
    });
}