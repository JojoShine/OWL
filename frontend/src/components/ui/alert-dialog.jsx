import * as React from 'react';
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from './dialog';
import { Button } from './button';
const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;
const AlertDialogPortal = DialogPortal;
const AlertDialogOverlay = DialogOverlay;
const AlertDialogHeader = DialogHeader;
const AlertDialogFooter = DialogFooter;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;
function AlertDialogContent(props) { return <DialogContent role="alertdialog" showCloseButton={false} preventOutsideClose {...props} />; }
function AlertDialogAction(props) { return <DialogClose asChild><Button {...props} /></DialogClose>; }
function AlertDialogCancel(props) { return <DialogClose asChild><Button variant="outline" {...props} /></DialogClose>; }
export { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel };
